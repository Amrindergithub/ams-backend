#!/usr/bin/env bash
# preflight.sh — sanity-check local services before demo/dev boot.
#
# Pings the ports AMS expects (MongoDB, Ganache, backend, frontend) and
# prints a coloured status line per service. Exits 1 if any required
# dependency (Mongo / Ganache) is down so CI-style workflows can gate.
#
# Usage:  ./scripts/preflight.sh

set -u

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BOLD="\033[1m"
RESET="\033[0m"

# Port, label, required flag (1 = fail preflight if down).
services=(
  "27017|MongoDB        |1"
  "7545 |Ganache RPC    |1"
  "5001 |Backend API    |0"
  "3000 |Frontend (CRA) |0"
)

exit_code=0

printf "${BOLD}AMS DApp preflight${RESET}\n"

for entry in "${services[@]}"; do
  IFS='|' read -r port label required <<< "$entry"
  port="$(echo "$port" | tr -d ' ')"
  label="$(echo "$label" | sed 's/[[:space:]]*$//')"

  if (echo > "/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1; then
    printf "  %b✓%b  %-18s (:%s) up\n" "$GREEN" "$RESET" "$label" "$port"
  else
    if [[ "$required" == "1" ]]; then
      printf "  %b✗%b  %-18s (:%s) down ${RED}(required)${RESET}\n" "$RED" "$RESET" "$label" "$port"
      exit_code=1
    else
      printf "  %b•%b  %-18s (:%s) not running\n" "$YELLOW" "$RESET" "$label" "$port"
    fi
  fi
done

if [[ "$exit_code" -ne 0 ]]; then
  printf "\n${RED}Preflight failed${RESET} — start the missing services and re-run.\n"
  printf "  • MongoDB  :  brew services start mongodb-community   (or docker)\n"
  printf "  • Ganache  :  open Ganache app or run 'ganache' on :7545 (chainId 1337)\n"
fi

exit "$exit_code"
