package dnsforward

import (
	"context"
	"log/slog"
	"net"
	"net/netip"
	"time"

	"github.com/AdguardTeam/AdGuardHome/internal/filtering"
	"github.com/AdguardTeam/dnsproxy/proxy"
	"github.com/AdguardTeam/golibs/netutil"
	"github.com/miekg/dns"
)

// To transfer information between modules
//
// TODO(s.chzhen):  Add lowercased, non-FQDN version of the hostname from the
// question of the request.  Add persistent client.
type dnsContext struct {
	proxyCtx *proxy.DNSContext

	// setts are the filtering settings for the client.
	setts *filtering.Settings

	result *filtering.Result

	// origResp is the response received from upstream.  It is set when the
	// response is modified by filters.
	origResp *dns.Msg

	// err is the error returned from a processing function.
	err error

	// clientID is the ClientID from DoH, DoQ, or DoT, if provided.
	clientID string

	// startTime is the time at which the processing of the request has started.
	startTime time.Time

	// origQuestion is the question received from the client.  It is set
	// when the request is modified by rewrites.
	origQuestion dns.Question

	// protectionEnabled shows if the filtering is enabled, and if the
	// server's DNS filter is ready.
	protectionEnabled bool

	// responseFromUpstream shows if the response is received from the
	// upstream servers.
	responseFromUpstream bool

	// responseAD shows if the response had the AD bit set.
	responseAD bool
}

// resultCode is the result of a request processing function.
type resultCode int

const (
	// resultCodeSuccess is returned when a handler performed successfully, and
	// the next handler must be called.
	resultCodeSuccess resultCode = iota

	// resultCodeFinish is returned when a handler performed successfully, and
	// the processing of the request must be stopped.
	resultCodeFinish

	// resultCodeError is returned when a handler failed, and the processing of
	// the request must be stopped.
	resultCodeError
)

// ddrHostFQDN is the FQDN used in Discovery of Designated Resolvers (DDR) requests.
// See https://www.ietf.org/archive/id/draft-ietf-add-ddr-06.html.
const ddrHostFQDN = "_dns.resolver.arpa."

// mozillaFQDN is the domain used to signal the Firefox browser to not use its
// own DoH server.
//
// See https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet.
const mozillaFQDN = "use-application-dns.net."

// healthcheckFQDN is a reserved domain-name used for healthchecking.
//
// [Section 6.2 of RFC 6761] states that DNS Registries/Registrars must not
// grant requests to register test names in the normal way to any person or
// entity, making domain names under the .test TLD free to use in internal
// purposes.
//
// [Section 6.2 of RFC 6761]: https://www.rfc-editor.org/rfc/rfc6761.html#section-6.2
const healthcheckFQDN = "healthcheck.adguardhome.test."

// processInitial terminates the following processing for some requests if
// needed and enriches dctx with some client-specific information.  l and dctx
// must not be nil.
//
// TODO(e.burkov):  Decompose into less general processors.
func (s *Server) processInitial(
	ctx context.Context,
	l *slog.Logger,
	dctx *dnsContext,
) (rc resultCode) {
	l.DebugContext(ctx, "started processing initial")
	defer l.DebugContext(ctx, "finished processing initial")

	pctx := dctx.proxyCtx
	s.processClientIP(ctx, l, pctx.Addr.Addr())

	q := pctx.Req.Question[0]
	qt := q.Qtype
	if s.conf.AAAADisabled && qt == dns.TypeAAAA {
		pctx.Res = s.NewMsgNODATA(pctx.Req)

		return resultCodeFinish
	}

	if (qt == dns.TypeA || qt == dns.TypeAAAA) && q.Name == mozillaFQDN {
		pctx.Res = s.NewMsgNXDOMAIN(pctx.Req)

		return resultCodeFinish
	}

	if q.Name == healthcheckFQDN {
		// Generate a NODATA negative response to make nslookup exit with 0.
		pctx.Res = s.replyCompressed(pctx.Req)

		return resultCodeFinish
	}

	// Get the ClientID, if any, before getting client-specific filtering
	// settings.
	clientID, ok := clientIDFromContext(ctx)
	if ok {
		dctx.clientID = clientID
	}

	// Get the client-specific filtering settings.
	dctx.protectionEnabled, _ = s.UpdatedProtectionStatus(ctx)
	dctx.setts = s.clientRequestFilteringSettings(dctx)

	return resultCodeSuccess
}

// processClientIP sends the client IP address to s.addrProc, if needed.  l must
// not be nil.
func (s *Server) processClientIP(ctx context.Context, l *slog.Logger, addr netip.Addr) {
	if !addr.IsValid() {
		l.WarnContext(ctx, "bad client address", "addr", addr)

		return
	}

	// Do not assign s.addrProc to a local variable to then use, since this lock
	// also serializes the closure of s.addrProc.
	s.serverLock.RLock()
	defer s.serverLock.RUnlock()

	s.addrProc.Process(ctx, addr)
}

// processDDRQuery responds to Discovery of Designated Resolvers (DDR) SVCB
// queries.  The response contains different types of encryption supported by
// current user configuration.  l and dctx must not be nil.
//
// See https://www.ietf.org/archive/id/draft-ietf-add-ddr-10.html.
func (s *Server) processDDRQuery(
	ctx context.Context,
	l *slog.Logger,
	dctx *dnsContext,
) (rc resultCode) {
	l.DebugContext(ctx, "started processing ddr")
	defer l.DebugContext(ctx, "finished processing ddr")

	if !s.conf.HandleDDR {
		return resultCodeSuccess
	}

	pctx := dctx.proxyCtx
	q := pctx.Req.Question[0]
	if q.Name == ddrHostFQDN {
		pctx.Res = s.makeDDRResponse(pctx.Req)

		return resultCodeFinish
	}

	return resultCodeSuccess
}

// makeDDRResponse creates a DDR answer based on the server configuration.  The
// constructed SVCB resource records have the priority of 1 for each entry,
// similar to examples provided by the [draft standard].
//
// TODO(a.meshkov):  Consider setting the priority values based on the protocol.
//
// [draft standard]: https://www.ietf.org/archive/id/draft-ietf-add-ddr-10.html.
func (s *Server) makeDDRResponse(req *dns.Msg) (resp *dns.Msg) {
	resp = s.replyCompressed(req)
	if req.Question[0].Qtype != dns.TypeSVCB {
		return resp
	}

	// TODO(e.burkov):  Think about storing the FQDN version of the server's
	// name somewhere.
	domainName := dns.Fqdn(s.conf.TLSConf.ServerName)

	for _, addr := range s.conf.TLSConf.HTTPSListenAddrs {
		values := []dns.SVCBKeyValue{
			&dns.SVCBAlpn{Alpn: []string{"h2"}},
			&dns.SVCBPort{Port: addr.Port()},
			&dns.SVCBDoHPath{Template: "/dns-query{?dns}"},
		}

		ans := &dns.SVCB{
			Hdr:      s.hdr(req, dns.TypeSVCB),
			Priority: 1,
			Target:   domainName,
			Value:    values,
		}

		resp.Answer = append(resp.Answer, ans)
	}

	s.appendDoTResolvers(req, resp, domainName)

	for _, addr := range s.conf.TLSConf.QUICListenAddrs {
		values := []dns.SVCBKeyValue{
			&dns.SVCBAlpn{Alpn: []string{"doq"}},
			&dns.SVCBPort{Port: uint16(addr.Port)},
		}

		ans := &dns.SVCB{
			Hdr:      s.hdr(req, dns.TypeSVCB),
			Priority: 1,
			Target:   domainName,
			Value:    values,
		}

		resp.Answer = append(resp.Answer, ans)
	}

	return resp
}

// appendDoTResolvers appends DNS-over-TLS SVCB resolver entries to resp if the
// server's TLS certificate contains IP addresses.  req and resp must not be
// nil.
func (s *Server) appendDoTResolvers(req, resp *dns.Msg, domainName string) {
	if !s.tlsManager.HasIPAddrs() {
		return
	}

	// Only add DNS-over-TLS resolvers in case the certificate contains IP
	// addresses.
	//
	// See https://github.com/AdguardTeam/AdGuardHome/issues/4927.
	for _, addr := range s.conf.TLSConf.TLSListenAddrs {
		values := []dns.SVCBKeyValue{
			&dns.SVCBAlpn{Alpn: []string{"dot"}},
			&dns.SVCBPort{Port: uint16(addr.Port)},
		}

		ans := &dns.SVCB{
			Hdr:      s.hdr(req, dns.TypeSVCB),
			Priority: 1,
			Target:   domainName,
			Value:    values,
		}

		resp.Answer = append(resp.Answer, ans)

	}
}

// processFilteringBeforeRequest applies filtering logic.  l and dctx must not
// be nil.
func (s *Server) processFilteringBeforeRequest(
	ctx context.Context,
	l *slog.Logger,
	dctx *dnsContext,
) (rc resultCode) {
	l.DebugContext(ctx, "started processing filtering before request")
	defer l.DebugContext(ctx, "finished processing filtering before request")

	if dctx.proxyCtx.RequestedPrivateRDNS != (netip.Prefix{}) {
		// There is no need to filter request for locally served ARPA hostname
		// so disable redundant filters.
		dctx.setts.ParentalEnabled = false
		dctx.setts.SafeBrowsingEnabled = false
	}

	if dctx.proxyCtx.Res != nil {
		// Go on since the response is already set.
		return resultCodeSuccess
	}

	s.serverLock.RLock()
	defer s.serverLock.RUnlock()

	var err error
	if dctx.result, err = s.filterDNSRequest(ctx, l, dctx); err != nil {
		dctx.err = err

		return resultCodeError
	}

	return resultCodeSuccess
}

// ipStringFromAddr extracts an IP address string from net.Addr.
func ipStringFromAddr(addr net.Addr) (ipStr string) {
	if ip, _ := netutil.IPAndPortFromAddr(addr); ip != nil {
		return ip.String()
	}

	return ""
}

// processUpstream passes request to upstream servers and handles the response.
// l and dctx must not be nil.
func (s *Server) processUpstream(
	ctx context.Context,
	l *slog.Logger,
	dctx *dnsContext,
) (rc resultCode) {
	l.DebugContext(ctx, "started processing upstream")
	defer l.DebugContext(ctx, "finished processing upstream")

	pctx := dctx.proxyCtx

	if pctx.Res != nil {
		// The response has already been set.
		return resultCodeSuccess
	}

	s.setCustomUpstream(ctx, l, pctx, dctx.clientID)

	// Process the request further since it wasn't filtered.
	prx := s.proxy()
	if prx == nil {
		dctx.err = srvClosedErr

		return resultCodeError
	}

	if dctx.err = prx.Resolve(ctx, pctx); dctx.err != nil {
		return resultCodeError
	}

	dctx.responseFromUpstream = true
	dctx.responseAD = pctx.Res.AuthenticatedData

	return resultCodeSuccess
}

// setCustomUpstream sets custom upstream settings in pctx, if necessary.  l and
// pctx must not be nil.
func (s *Server) setCustomUpstream(
	ctx context.Context,
	l *slog.Logger,
	pctx *proxy.DNSContext,
	clientID string,
) {
	if !pctx.Addr.IsValid() || s.conf.ClientsContainer == nil {
		return
	}

	cliAddr := pctx.Addr.Addr()
	upsConf := s.conf.ClientsContainer.CustomUpstreamConfig(clientID, cliAddr)
	if upsConf != nil {
		l.DebugContext(
			ctx,
			"using custom upstreams for client with",
			"ip", cliAddr,
			"client_id", clientID,
		)

		pctx.CustomUpstreamConfig = upsConf
	}
}

// Apply filtering logic after we have received response from upstream servers.
// l and dctx must not be nil.
func (s *Server) processFilteringAfterResponse(
	ctx context.Context,
	l *slog.Logger,
	dctx *dnsContext,
) (rc resultCode) {
	l.DebugContext(ctx, "started processing filtering after response")
	defer l.DebugContext(ctx, "finished processing filtering after response")

	switch res := dctx.result; res.Reason {
	case filtering.NotFilteredAllowList:
		return resultCodeSuccess
	case
		filtering.Rewritten,
		filtering.RewrittenRule:

		if dctx.origQuestion.Name == "" {
			// origQuestion is set in case we get only CNAME without IP from
			// rewrites table.
			return resultCodeSuccess
		}

		pctx := dctx.proxyCtx
		pctx.Req.Question[0], pctx.Res.Question[0] = dctx.origQuestion, dctx.origQuestion

		rr := s.genAnswerCNAME(pctx.Req, res.CanonName)
		answer := append([]dns.RR{rr}, pctx.Res.Answer...)
		pctx.Res.Answer = answer

		return resultCodeSuccess
	default:
		return s.filterAfterResponse(ctx, l, dctx)
	}
}

// filterAfterResponse returns the result of filtering the response that wasn't
// explicitly allowed or rewritten.  l and dctx must not be nil.
func (s *Server) filterAfterResponse(
	ctx context.Context,
	l *slog.Logger,
	dctx *dnsContext,
) (res resultCode) {
	// Check the response only if it's from an upstream.  Don't check the
	// response if the protection is disabled since dnsrewrite rules aren't
	// applied to it anyway.
	if !dctx.protectionEnabled || !dctx.responseFromUpstream {
		return resultCodeSuccess
	}

	err := s.filterDNSResponse(ctx, l, dctx)
	if err != nil {
		dctx.err = err

		return resultCodeError
	}

	return resultCodeSuccess
}
