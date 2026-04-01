import fs from 'fs';

const SUPABASE_URL = "https://gtefgucwbskgknsdirvj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZWZndWN3YnNrZ2tuc2RpcnZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDUyOCwiZXhwIjoyMDg5NzE2NTI4fQ.01PjGhuJvLOIixjuGUCpsVzhX-4MWjcESC_nnkeZJJg";

const serviceMapping = {};
const monthMap = {
    "marca": "03",
    "apríla": "04",
    "mája": "05"
};

async function checkExists(booking) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?client_name=eq.${encodeURIComponent(booking.client_name)}&date=eq.${booking.date}&time_slot=eq.${booking.time_slot}&select=id`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    const data = await res.json();
    return data.length > 0;
}

async function getOrCreateService(name) {
    console.log(`Checking/Creating service: ${name}`);
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/services?name_sk=eq.${encodeURIComponent(name)}&select=id`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    const checkData = await checkRes.json();
    if (checkData.length > 0) return checkData[0].id;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/services`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            name_sk: name,
            name_en: name,
            duration: 30,
            price: 40.0,
            category: 'chiropractic',
            is_active: true
        })
    });
    const data = await res.json();
    if (data && data.length > 0) return data[0].id;
    return "be82906f-a5ae-4530-bccb-7afca71b86ef";
}

async function run() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const content = fs.readFileSync('c:/Users/42195/Documents/git-connect-hub/docs/zoznam-objednavok-co-treba-doplnit.ini', 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    serviceMapping["Express termín"] = await getOrCreateService("Express termín");
    serviceMapping["Chiro masáž"] = await getOrCreateService("Chiro masáž");
    serviceMapping["Chiropraxia/Naprávanie"] = await getOrCreateService("Chiropraxia/Naprávanie");
    serviceMapping["Celotelová chiro masáž"] = await getOrCreateService("Celotelová chiro masáž");

    const ALL_SERVICES = ["Express termín", "Chiro masáž", "Chiropraxia/Naprávanie", "Celotelová chiro masáž", "Fyzioterapia"];

    let currentDay = "";
    let bookings = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        const dateMatch = line.match(/(?:pondelok|utorok|streda|štvrtok|piatok|sobota|nedeľa)\s+(\d+)\.\s+([a-záčďéíľňóôŕšťúýž]+)/i);
        if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const monthText = dateMatch[2].toLowerCase();
            const month = monthMap[monthText];
            if (month) {
                currentDay = `2026-${month}-${day}`;
            } else {
                console.warn(`UNKNOWN MONTH: ${monthText}`);
            }
            continue;
        }

        if (line.match(/^\d{1,2}:\d{2}$/)) {
            const startTime = line.padStart(5, '0');
            let bookingData = {
                time_slot: `${startTime}:00`,
                date: currentDay,
                status: 'confirmed'
            };

            let j = i + 1;
            let details = [];
            while (j < lines.length) {
                const nextLine = lines[j];
                if (nextLine.match(/^\d{1,2}:\d{2}$/) || nextLine.match(/(?:pondelok|utorok|streda|štvrtok|piatok|sobota|nedeľa)/i) || nextLine.includes('###')) break;
                details.push(nextLine);
                j++;
            }

            if (details.length >= 4) {
                const endTimeCandidates = details.filter(d => d.match(/^\d{1,2}:\d{2}$/));
                const durationCandidates = details.filter(d => d.match(/\d+\s*min/i));
                const phoneCandidates = details.filter(d => d.match(/\+?\d[\d\s]{7,}/));
                const emailCandidates = details.filter(d => d.match(/@/));
                
                const serviceCandidates = details.filter(d => ALL_SERVICES.some(s => d.includes(s)));
                
                const ignoreSet = new Set(["Potvrdené", "Personál FYZIO&FIT"]);
                
                let name = "";
                for (let k = 0; k < details.length; k++) {
                    const d = details[k];
                    if (endTimeCandidates.includes(d) || durationCandidates.includes(d) || 
                        phoneCandidates.includes(d) || emailCandidates.includes(d) || 
                        serviceCandidates.includes(d) || ignoreSet.has(d)) {
                        continue;
                    }
                    if (d.length > 3) { // Simple filter for short words
                        name = d;
                        break;
                    }
                }

                bookingData.client_name = name;
                bookingData.client_phone = phoneCandidates[0] || "";
                bookingData.client_email = emailCandidates[0] || "";
                bookingData.service_id = serviceMapping[serviceCandidates[0]] || serviceMapping["Chiro masáž"];
                
                const durMatch = (durationCandidates[0] || "").match(/(\d+)/);
                bookingData.booking_duration = durMatch ? parseInt(durMatch[1]) : 30;

                if (bookingData.client_name && bookingData.client_name !== "Neznáme Meno") {
                    bookings.push(bookingData);
                }
            }
            i = j - 1;
        }
    }

    console.log(`Parsed ${bookings.length} bookings.`);

    for (const b of bookings) {
        if (!b.date || b.date.includes('undefined')) continue;
        if (await checkExists(b)) {
            console.log(`Skipping existing: ${b.client_name} on ${b.date}`);
            continue;
        }
        process.stdout.write(`Inserting ${b.client_name} on ${b.date}... `);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(b)
        });
        if (res.ok) process.stdout.write("OK\n");
        else console.log("FAILED", await res.text());
    }
}

run();
