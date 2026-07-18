@echo off
rem IncredibleSmartDisplay local server autostart.
rem Copy this file into the Startup folder (Win+R -> shell:startup) to launch the
rem server minimized at logon. Delete the copy to disable autostart.
start "SmartDisplay LocalServer" /min cmd /c "cd /d C:\WORKSPACE\IncredibleSmartDisplay && node server\local-server.mjs"
