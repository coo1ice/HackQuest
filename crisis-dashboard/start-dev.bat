@echo off
rem Forwarding batch to repository root start-dev.bat

pushd %~dp0\.. || (echo Failed to resolve repo root & exit /b 1)
call "%~dp0\..\start-dev.bat" %*
popd
