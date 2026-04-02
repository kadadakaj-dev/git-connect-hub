class BookingWidget extends HTMLElement {
  connectedCallback() {
    const apiBase = this.getAttribute("api-base") ?? "";
    const tenantId = this.getAttribute("tenant-id") ?? "";
    const apiKey = this.getAttribute("api-key") ?? "";

    this.innerHTML = `
      <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
        <strong>Booking Widget</strong>
        <p>Tenant: ${tenantId}</p>
        <button id="booking-widget-load">Load</button>
        <pre id="booking-widget-output" style="margin-top: 8px;"></pre>
      </div>
    `;

    const button = this.querySelector<HTMLButtonElement>("#booking-widget-load");
    const output = this.querySelector<HTMLPreElement>("#booking-widget-output");

    button?.addEventListener("click", async () => {
      if (!apiBase || !tenantId) {
        if (output) output.textContent = "Missing api-base or tenant-id";
        return;
      }
      const response = await fetch(`${apiBase}/tenants/${tenantId}/bookings?from=2024-01-01&to=2024-01-02`, {
        headers: apiKey ? { "x-api-key": apiKey } : {}
      });
      const data = await response.json();
      if (output) output.textContent = JSON.stringify(data, null, 2);
    });
  }
}

customElements.define("booking-widget", BookingWidget);
