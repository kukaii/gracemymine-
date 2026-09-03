export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    try {
        const BOT_TOKEN = process.env.BOT_TOKEN;
        const CHAT_ID = process.env.CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({
                ok: false,
                error: "BOT_TOKEN atau CHAT_ID belum diatur di Vercel."
            });
        }

        const body = req.body || {};
        const message = typeof body.message === "string" ? body.message.trim() : "";
        const photo = body.photo;

        if (!message && !photo) {
            return res.status(400).json({
                ok: false,
                error: "Pesan atau foto harus diisi."
            });
        }

        let response;

        if (photo) {
            const base64 = String(photo.data || "")
                .replace(/^data:[^;]+;base64,/, "");

            if (!base64) {
                return res.status(400).json({
                    ok: false,
                    error: "Data foto tidak valid."
                });
            }

            const buffer = Buffer.from(base64, "base64");
            const form = new FormData();

            form.append("chat_id", CHAT_ID);
            form.append(
                "photo",
                new Blob([buffer], { type: photo.type || "image/jpeg" }),
                photo.name || "photo.jpg"
            );

            form.append("caption",
`💌 PESAN DARI WEBSITE

${message || "(Tidak ada pesan teks)"}

📸 Ada foto yang ikut dikirim.

━━━━━━━━━━━━━━
🌷 dikirim dari halaman kecil`);

            response = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
                { method: "POST", body: form }
            );

        } else {

            response = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text:
`💌 PESAN DARI WEBSITE

Seseorang meninggalkan pesan:

"${message}"

━━━━━━━━━━━━━━
🌷 dikirim dari halaman kecil`
                    })
                }
            );
        }

        const result = await response.json();

        if (!response.ok || !result.ok) {
            return res.status(502).json({
                ok: false,
                error: result.description || "Telegram gagal menerima pesan."
            });
        }

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            error: "Terjadi kesalahan pada server."
        });
    }
    }
