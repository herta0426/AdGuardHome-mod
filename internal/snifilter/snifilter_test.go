package snifilter

import (
	"encoding/binary"
	"net/netip"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testTimeout is the timeout for the tests that use the network.
const testTimeout = 5 * time.Second

func TestParams_Validate(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name    string
		params  Params
		wantErr bool
	}{{
		name:    "disabled",
		params:  Params{},
		wantErr: false,
	}, {
		name: "valid",
		params: Params{
			Enabled:  true,
			QueueNum: 7,
			Ports:    []uint16{443},
			UIDs:     []string{"1000", "10000-19999"},
		},
		wantErr: false,
	}, {
		name: "no_ports",
		params: Params{
			Enabled: true,
			Ports:   nil,
		},
		wantErr: true,
	}, {
		name: "zero_port",
		params: Params{
			Enabled: true,
			Ports:   []uint16{0},
		},
		wantErr: true,
	}, {
		name: "bad_uid",
		params: Params{
			Enabled: true,
			Ports:   []uint16{443},
			UIDs:    []string{"root"},
		},
		wantErr: true,
	}, {
		name: "bad_uid_range",
		params: Params{
			Enabled: true,
			Ports:   []uint16{443},
			UIDs:    []string{"100-1"},
		},
		wantErr: true,
	}, {
		name: "bad_uid_range_empty",
		params: Params{
			Enabled: true,
			Ports:   []uint16{443},
			UIDs:    []string{"-100"},
		},
		wantErr: true,
	}}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			err := tc.params.Validate()
			if tc.wantErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// TestParsePacket tests the parsing of the raw TCP packets of both address
// families.
func TestParsePacket(t *testing.T) {
	t.Parallel()

	src := netip.MustParseAddrPort("10.0.0.1:12345")
	dst := netip.MustParseAddrPort("192.0.2.1:443")
	v6Src := netip.MustParseAddrPort("[2001:db8::1]:12345")
	v6Dst := netip.MustParseAddrPort("[2001:db8::2]:443")

	const (
		seq  = 1000
		ack  = 2000
		data = "hello"
	)

	testCases := []struct {
		name    string
		pkt     []byte
		src     netip.AddrPort
		dst     netip.AddrPort
		wantErr error
	}{{
		name: "ipv4",
		pkt:  tcpPacket4(src, dst, seq, ack, tcpFlagACK, []byte(data)),
		src:  src,
		dst:  dst,
	}, {
		name: "ipv6",
		pkt:  tcpPacket6(v6Src, v6Dst, seq, ack, tcpFlagACK, []byte(data)),
		src:  v6Src,
		dst:  v6Dst,
	}, {
		name:    "ipv4_short",
		pkt:     []byte{0x45},
		wantErr: errNotIPPacket,
	}, {
		name:    "ipv4_udp",
		pkt:     withByte(tcpPacket4(src, dst, seq, ack, tcpFlagACK, nil), 9, 17),
		wantErr: errNotTCPPacket,
	}, {
		name: "ipv4_fragment",
		// Set a non-zero fragment offset.
		pkt:     withByte(withByte(tcpPacket4(src, dst, seq, ack, tcpFlagACK, nil), 6, 0x00), 7, 0x10),
		wantErr: errNotTCPPacket,
	}, {
		name:    "unknown_version",
		pkt:     []byte{0x50, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		wantErr: errNotIPPacket,
	}}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			p, err := parsePacket(tc.pkt)
			if tc.wantErr != nil {
				require.ErrorIs(t, err, tc.wantErr)
				assert.Nil(t, p)

				return
			}

			require.NoError(t, err)
			require.NotNil(t, p)

			assert.Equal(t, tc.src, p.src)
			assert.Equal(t, tc.dst, p.dst)
			assert.Equal(t, uint32(seq), p.seq)
			assert.Equal(t, uint32(ack), p.ack)
			assert.Equal(t, uint8(tcpFlagACK), p.flags)
			assert.Equal(t, []byte(data), p.payload)
		})
	}
}

// TestResetSegments tests the calculation of the reset segments of a blocked
// connection.
func TestResetSegments(t *testing.T) {
	t.Parallel()

	src := netip.MustParseAddrPort("10.0.0.1:12345")
	dst := netip.MustParseAddrPort("192.0.2.1:443")

	p := &packet{
		src:     src,
		dst:     dst,
		seq:     1000,
		ack:     2000,
		flags:   tcpFlagACK,
		payload: []byte("hello"),
	}

	toClient, toServer := resetSegments(p)

	// The client gets the segment that looks like it comes from the server
	// and expects the next byte the client is going to send.
	assert.Equal(t, rstSegment{src: dst, dst: src, seq: 2000, ack: 1005}, toClient)

	// The server gets the segment that looks like it comes from the client
	// and expects the next byte the server is going to send.
	assert.Equal(t, rstSegment{src: src, dst: dst, seq: 1000, ack: 2000}, toServer)
}

// tcpPacket4 returns a raw IPv4 packet with a TCP segment.
func tcpPacket4(
	src, dst netip.AddrPort,
	seq, ack uint32,
	flags uint8,
	payload []byte,
) (pkt []byte) {
	srcAddr, dstAddr := src.Addr().As4(), dst.Addr().As4()
	seg := tcpSegmentBytes(src, dst, seq, ack, flags, payload)

	pkt = make([]byte, 0, ipv4HeaderLen+len(seg))
	pkt = append(pkt, 0x45, 0)
	pkt = binary.BigEndian.AppendUint16(pkt, uint16(ipv4HeaderLen+len(seg)))
	pkt = binary.BigEndian.AppendUint16(pkt, 0)
	pkt = binary.BigEndian.AppendUint16(pkt, 0)
	pkt = append(pkt, 64, 6, 0, 0)
	pkt = append(pkt, srcAddr[:]...)
	pkt = append(pkt, dstAddr[:]...)

	return append(pkt, seg...)
}

// tcpPacket6 returns a raw IPv6 packet with a TCP segment.
func tcpPacket6(
	src, dst netip.AddrPort,
	seq, ack uint32,
	flags uint8,
	payload []byte,
) (pkt []byte) {
	srcAddr, dstAddr := src.Addr().As16(), dst.Addr().As16()
	seg := tcpSegmentBytes(src, dst, seq, ack, flags, payload)

	pkt = make([]byte, 0, ipv6HeaderLen+len(seg))
	pkt = append(pkt, 0x60, 0, 0, 0)
	pkt = binary.BigEndian.AppendUint16(pkt, uint16(len(seg)))
	// The next header and the hop limit.
	pkt = append(pkt, 6, 64)
	pkt = append(pkt, srcAddr[:]...)
	pkt = append(pkt, dstAddr[:]...)

	return append(pkt, seg...)
}

// tcpSegmentBytes returns a TCP header with payload.
func tcpSegmentBytes(
	src, dst netip.AddrPort,
	seq, ack uint32,
	flags uint8,
	payload []byte,
) (seg []byte) {
	seg = binary.BigEndian.AppendUint16(seg, src.Port())
	seg = binary.BigEndian.AppendUint16(seg, dst.Port())
	seg = binary.BigEndian.AppendUint32(seg, seq)
	seg = binary.BigEndian.AppendUint32(seg, ack)
	seg = append(seg, tcpHeaderLen/4<<4, flags, 0, 0, 0, 0, 0, 0)

	return append(seg, payload...)
}
