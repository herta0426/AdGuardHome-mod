package configmigrate

import (
	"context"
	"fmt"
)

// migrateTo22 performs the following changes:
//
//	# BEFORE:
//	'schema_version': 21
//	'persistent':
//	  - 'name': 'client_name'
//	    'blocked_services':
//	    - 'svc_name'
//	    - # …
//	    # …
//	  # …
//	# …
//
//	# AFTER:
//	'schema_version': 22
//	'persistent':
//	  - 'name': 'client_name'
//	    # …
//	  # …
//	# …
//
// Upstream turned 'clients[].blocked_services' into an object with a schedule
// here, but the mod doesn't support blocked services, so the field is dropped.
func (m *Migrator) migrateTo22(_ context.Context, diskConf yobj) (err error) {
	diskConf["schema_version"] = 22

	const field = "blocked_services"

	clients, ok, err := fieldVal[yobj](diskConf, "clients")
	if !ok {
		return err
	}

	persistent, ok, err := fieldVal[yarr](clients, "persistent")
	if !ok {
		return err
	}

	for i, p := range persistent {
		var c yobj
		c, ok = p.(yobj)
		if !ok {
			return fmt.Errorf("persistent client at index %d: unexpected type %T", i, p)
		}

		delete(c, field)
	}

	return nil
}
