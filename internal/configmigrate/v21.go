package configmigrate

import "context"

// migrateTo21 performs the following changes:
//
//	# BEFORE:
//	'schema_version': 20
//	'dns':
//	  'blocked_services':
//	  - 'svc_name'
//	  - # …
//	  # …
//	# …
//
//	# AFTER:
//	'schema_version': 21
//	'dns':
//	  # …
//	# …
//
// Upstream turned 'dns.blocked_services' into an object with a schedule here,
// but the mod doesn't support blocked services, so the field is dropped.
func (m *Migrator) migrateTo21(_ context.Context, diskConf yobj) (err error) {
	diskConf["schema_version"] = 21

	const field = "blocked_services"

	dns, ok, err := fieldVal[yobj](diskConf, "dns")
	if !ok {
		return err
	}

	delete(dns, field)

	return nil
}
