import CheckoutForm from '../islands/CheckoutForm'

export default function CheckoutPage() {
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 class="text-2xl font-bold text-gray-900">Checkout Pesanan</h1>
        </div>
      </header>

      <main class="flex-grow w-full max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div class="bg-white p-6 md:p-8 rounded-xl shadow border">
          <CheckoutForm />
        </div>
      </main>
    </div>
  )
}
