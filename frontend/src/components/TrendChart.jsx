import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function TrendChart({ trend }) {
  const data = trend.points.map((p) => ({ date: p.date, value: p.value }))
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'auto']} unit={trend.unit ? ` ${trend.unit}` : ''} width={80} />
          <Tooltip />
          {trend.refLow != null && trend.refHigh != null && (
            <ReferenceArea y1={trend.refLow} y2={trend.refHigh} fill="#22c55e" fillOpacity={0.12} />
          )}
          <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
