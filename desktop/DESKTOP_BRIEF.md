# q2play Desktop Implementation Brief

Build a functional Windows desktop client for q2play using only free and open-source tools. Reuse the existing React interface and production API while making the experience feel like a persistent communication app: one running instance, durable login session, native window, system tray, optional Windows startup, safe external navigation, media permissions for future calls, and native chat notifications. Package the result as a Windows installer and verify the packaged frontend can load independently from the development server.

The desktop client must preserve all existing matchmaking, friends, Riot dashboards, messages, and match celebration behavior. It must not expose Node.js APIs to the web interface or include private backend credentials.
