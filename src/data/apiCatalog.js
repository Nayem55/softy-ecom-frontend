// The catalog API has historically been deployed in both paginated-object and
// plain-array forms. Keep that transport detail at the edge of the app.
export const catalogItems = (payload, key) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.[key])) return payload[key]
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.[key])) return payload.data[key]
  return null
}
