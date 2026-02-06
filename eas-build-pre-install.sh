#!/usr/bin/env bash

set -euo pipefail

# Install pnpm
npm install -g pnpm

# Install all workspace dependencies from root
cd ../..
pnpm install --frozen-lockfile
