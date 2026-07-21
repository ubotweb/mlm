import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  const sponsorId = c.req.query('ref') || ''
  const error = c.req.query('error')

  return c.render(
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Daftar Member Baru</h2>
      </div>
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Perhatikan penambahan method="POST" dan action ke API */}
          <form method="POST" action="/api/register" class="space-y-4">
            {error && <div class="bg-red-50 text-red-700 p-3 text-sm rounded">{error}</div>}
            
            <input type="text" name="sponsorId" value={sponsorId} class="block w-full border rounded-md py-2 px-3" placeholder="ID Sponsor (Opsional)" />
            <input type="text" name="fullName" required class="block w-full border rounded-md py-2 px-3" placeholder="Nama Lengkap" />
            <input type="text" name="username" required class="block w-full border rounded-md py-2 px-3" placeholder="Username" />
            <input type="email" name="email" required class="block w-full border rounded-md py-2 px-3" placeholder="Email" />
            <input type="text" name="phone" required class="block w-full border rounded-md py-2 px-3" placeholder="Nomor HP" />
            <input type="password" name="password" required class="block w-full border rounded-md py-2 px-3" placeholder="Password" />
            
            <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Daftar Sekarang</button>
          </form>
        </div>
      </div>
    </div>
  )
})
