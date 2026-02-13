package com.foodgrid.common.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Path("/")
public class LandingResource {

    @GET
    @Produces(MediaType.TEXT_HTML)
    public String getLandingPage() {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>FoodGrid Backend | Live</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --primary: #4f46e5;
                        --bg: #f8fafc;
                        --card: #ffffff;
                        --text: #1e293b;
                        --muted: #64748b;
                        --success: #10b981;
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background: var(--bg);
                        color: var(--text);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 20px;
                    }
                    .card {
                        background: var(--card);
                        border-radius: 24px;
                        padding: 48px;
                        width: 100%;
                        max-width: 500px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
                        text-align: center;
                        border: 1px solid #e2e8f0;
                    }
                    .status-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #ecfdf5;
                        color: var(--success);
                        padding: 8px 16px;
                        border-radius: 99px;
                        font-weight: 600;
                        font-size: 14px;
                        margin-bottom: 24px;
                        border: 1px solid #d1fae5;
                    }
                    .status-dot {
                        width: 8px;
                        height: 8px;
                        background: var(--success);
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                    }
                    h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.025em; }
                    p { color: var(--muted); line-height: 1.6; margin-bottom: 32px; }
                    .info-grid {
                        display: grid;
                        gap: 16px;
                        text-align: left;
                        background: #f1f5f9;
                        padding: 24px;
                        border-radius: 16px;
                        font-size: 14px;
                    }
                    .info-item { display: flex; justify-content: space-between; }
                    .info-label { color: var(--muted); font-weight: 500; }
                    .info-value { font-weight: 600; }
                    .footer { margin-top: 32px; font-size: 13px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="status-badge">
                        <div class="status-dot"></div>
                        Server Operational
                    </div>
                    <h1>FoodGrid Core</h1>
                    <p>Quarkus Cloud Platform is active and responding to requests.</p>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Version</span>
                            <span class="info-value">0.1.0-DEV</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Runtime</span>
                            <span class="info-value">Quarkus 3.x / Java 21</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Local Time</span>
                            <span class="info-value">{{NOW}}</span>
                        </div>
                    </div>

                    <div class="footer">
                        © 2026 FoodGrid POS Ecosystem
                    </div>
                </div>
            </body>
            </html>
            """.replace("{{NOW}}", now);
    }
}
