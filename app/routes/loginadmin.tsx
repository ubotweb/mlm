import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  const error = c.req.query('error')
  const success = c.req.query('success')

  return c.render(
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Masuk ke Akun Anda</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Atau <a href="/register" class="font-medium text-blue-600 hover:text-blue-500">daftar menjadi member</a>
        </p>
      </div>
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <form method="POST" action="/api/login" class="space-y-6">
            {error && <div class="bg-red-50 text-red-700 p-3 text-sm rounded">{error}</div>}
            {success && <div class="bg-green-50 text-green-700 p-3 text-sm rounded">{success}</div>}
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" name="username" required class="mt-1 block w-full border rounded-md py-2 px-3" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" name="password" required class="mt-1 block w-full border rounded-md py-2 px-3" />
            </div>
            
            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Masuk
            </button>
          </form>

        </div>
      </div>
    </div>
  )
})
