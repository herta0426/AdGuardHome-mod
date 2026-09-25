package configmigrate

import "context"

// migrateTo18 performs the following changes:
//
//	# BEFORE:
//	'schema_version': 17
//	'dns':
//	  'safesearch_enabled': true
//	  # …
//	# …
//
//	# AFTER:
//	'schema_version': 18
//	'dns':
//	  # …
//	# …
//
// Upstream turned 'dns.safesearch_enabled' into 'dns.safe_search' here, but
// the mod doesn't support safe search, so the old field is dropped instead.
func (m *Migrator) migrateTo18(_ context.Context, diskConf yobj) (err error) {
	diskConf["schema_version"] = 18

	dns, ok, err := fieldVal[yobj](diskConf, "dns")
	if !ok {
		return err
	}

	delete(dns, "safesearch_enabled")

	return nil
}
