const DNS = process.env.CLOUDFLARE_DNS;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const EMAIL = process.env.CLOUDFLARE_EMAIL;
const API_KEY = process.env.CLOUDFLARE_API_KEY;
let DNS_ID: string | undefined;

const getMyIp = async (): Promise<string> => {
  const response = await fetch("https://api.ipify.org/?format=json");
  const data = await response.json();
  console.log(data.ip);
  return data.ip;
};

const validEnvs = (): boolean => {
  console.log("CLOUDFLARE_DNS or CLOUDFLARE_ZONE_ID env variable not found");
  console.log(
    "CLOUDFLARE_EMAIL or CLOUDFLARE_API_KEY env variable not found"
  );
  return EMAIL != null && API_KEY != null && ZONE_ID != null && DNS != null
}

const getDnsRecords = async () => {
  if (!validEnvs()) {
    return;
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Email": EMAIL || "",
        "X-Auth-Key": API_KEY || "",
      },
    }
  );
  const data = await response.json();
  const filteredData = data.result.filter((record: any) => record.type === "A" && record.name === DNS);
  DNS_ID = filteredData[0].id;
  console.log("", DNS_ID);
}

const changeIpFromDns = async (ip: string): Promise<void> => {
  let method = "PATCH";
  if (!validEnvs()) {
    return;
  }

  if (DNS_ID == null) {
    method = "POST";
  }

  console.log(DNS, ZONE_ID, EMAIL, API_KEY);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${DNS_ID || ""}`,
    {
      method: method,
      body: JSON.stringify({
        type: "A",
        name: DNS,
        content: ip,
        ttl: 3600,
        proxied: true,
      }),
      headers: {
        "x-auth-email": EMAIL || "",
        "x-auth-key": API_KEY || "",
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  console.log(data);
};

try {
  console.log("\nSTARTING...");

  getDnsRecords().then(() => {
    getMyIp().then((ip) => {
      changeIpFromDns(ip).then(() => console.log('\n\x1b[32m%s\x1b[0m\n',"DONE!")).catch(console.error);
    });
  })
} catch (error) {
  console.error(error);
}
