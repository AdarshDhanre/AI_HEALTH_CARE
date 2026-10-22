export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-')
export const fmtNum = (n) => (n === null || n === undefined ? '-' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }))
export const fmtRange = (lo, hi) => {
  if (lo == null && hi == null) return '-'
  if (lo == null) return `< ${fmtNum(hi)}`
  if (hi == null) return `> ${fmtNum(lo)}`
  return `${fmtNum(lo)} - ${fmtNum(hi)}`
}
export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong'
