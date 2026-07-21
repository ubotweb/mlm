import { useState, useEffect } from 'hono/jsx'

export default function NetworkTree() {
  const [networkData, setNetworkData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Endpoint ini nantinya disiapkan di backend untuk menarik data CTE SQLite (Hirarki)
    fetch('/api/member/network')
      .then(res => res.json())
      .then(data => {
        // Simulasi Data Jaringan sementara jika backend belum mengembalikan data CTE
        setNetworkData(data.network || {
          username: "Anda (Root)",
          package: "Gold",
          children: [
            { username: "Downline 1", package: "Silver", children: [] },
            { username: "Downline 2", package: "Starter", children: [
                { username: "Downline 3", package: "Starter", children: [] }
            ]}
          ]
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Fungsi rekursif sederhana untuk merender pohon ke bawah
  const renderNode = (node: any) => {
    return (
      <div class="flex flex-col items-center">
        {/* Node Member */}
        <div class="border-2 border-blue-600 rounded-lg p-3 w-32 text-center bg-blue-50 shadow-sm relative z-10">
          <div class="h-10 w-10 bg-blue-200 rounded-full mx-auto mb-2 flex items-center justify-center text-blue-700 font-bold">
             {node.username.charAt(0).toUpperCase()}
          </div>
          <p class="text-xs font-bold text-gray-800 truncate">{node.username}</p>
          <p class="text-[10px] text-white bg-blue-600 rounded mt-1">{node.package}</p>
        </div>

        {/* Render Garis dan Children jika ada */}
        {node.children && node.children.length > 0 && (
          <div class="flex flex-col items-center mt-4">
            <div class="w-px h-6 bg-blue-400"></div>
            <div class="flex space-x-8 border-t-2 border-blue-400 pt-4">
              {node.children.map((child: any, idx: number) => (
                <div key={idx} class="relative flex flex-col items-center">
                  <div class="absolute -top-4 w-px h-4 bg-blue-400"></div>
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div class="text-center py-20 text-gray-500">Memuat pohon jaringan...</div>

  return (
    <div class="flex justify-center p-8 min-w-max">
      {networkData ? renderNode(networkData) : <p>Belum ada jaringan downline.</p>}
    </div>
  )
}
