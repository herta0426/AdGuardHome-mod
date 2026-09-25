package configmigrate

import "context"

// migrateTo4 only bumps the schema version.
//
// The sole change between the third and the fourth schema versions was the
// 'clients[].use_global_blocked_services' field.  The mod does not support
// blocked services at all, so the migration must not write it.  The function
// is still required, because the upgrade chain cannot skip a version.
func (m *Migrator) migrateTo4(_ context.Context, diskConf yobj) (err error) {
	diskConf["schema_version"] = 4

	return nil
}
