//go:build !dev
// +build !dev

package main

// devMode returns false in production builds
func devMode() bool {
	return false
}

