#!/bin/sh

# AdGuard Home Mod Version Generation Script
#
# The mod uses date-based versions, for example v2026-09-23.  The date is the
# date of the latest commit, so the same commit always produces the same
# version, and tags are expected to look like v2026-09-23 as well.
#
# A release candidate or a beta adds a suffix, for example v2026-09-23-rc.1,
# v2026-09-23-beta, or v2026-09-23-beta-1.  The CI workflow uses the suffix to
# publish those tags as pre-releases.
#
# The valid output format is "vYYYY-MM-DD" with an optional "-suffix".

verbose="${VERBOSE:-0}"
readonly verbose

if [ "$verbose" -gt '0' ]; then
	set -x
fi

set -e -f -u

version_pattern='^v[0-9]{4}-[0-9]{2}-[0-9]{2}(-[0-9A-Za-z][0-9A-Za-z.-]*)?$'
readonly version_pattern

# Prefer a date tag, if the current commit has one.
tag="$(git describe --exact-match --tags 2>/dev/null || true)"
readonly tag

if echo "$tag" | grep -E -e "$version_pattern" -q; then
	version="$tag"
else
	# Use the date of the latest commit rather than the date of the build, so
	# that rebuilding the same commit produces the same version.
	commit_date="$(git log -1 --pretty=%cd --date=format-local:%Y-%m-%d)"
	readonly commit_date

	if [ -z "$commit_date" ]; then
		echo 'cannot get the commit date' 1>&2

		exit 1
	fi

	version="v${commit_date}"
fi
readonly version

# Finally, make sure that we don't output an invalid version.
if ! echo "$version" | grep -E -e "$version_pattern" -q; then
	echo "generated an invalid version '$version'" 1>&2

	exit 1
fi

echo "$version"
