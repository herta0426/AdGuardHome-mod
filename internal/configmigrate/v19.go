package configmigrate

import "context"

// migrateTo19 performs the following changes:
//
//	# BEFORE:
//	'schema_version': 18
//	'clients':
//	  'persistent':
//	  - 'name': 'client-name'
//	    'safesearch_enabled': true
//	    # …
//	  # …
//	# …
//
//	# AFTER:
//	'schema_version': 19
//	'clients':
//	  'persistent':
//	  - 'name': 'client-name'
//	    # …
//	  # …
//	# …
//
// Upstream turned 'clients[].safesearch_enabled' into
// 'clients[].safe_search' here, but the mod doesn't support safe search, so the
// old field is dropped instead.
func (m *Migrator) migrateTo19(_ context.Context, diskConf yobj) (err error) {
	diskConf["schema_version"] = 19

	clients, ok, err := fieldVal[yobj](diskConf, "clients")
	if !ok {
		return err
	}

	persistent, ok, _ := fieldVal[yarr](clients, "persistent")
	if !ok {
		return nil
	}

	for _, p := range persistent {
		var c yobj
		c, ok = p.(yobj)
		if !ok {
			continue
		}

		delete(c, "safesearch_enabled")
	}

	return nil
}
