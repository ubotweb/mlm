import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'
import WithdrawForm from '../../islands/WithdrawForm'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } 
  catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  const user = await db.prepare("SELECT balance FROM users WHERE username = ?").bind(profile.sub).first()
  
  return c.render(
    <MemberLayout profile={profile} balance={(user?.balance as number) || 0} activeMenu="Pencairan (Withdraw)">
      <div>
        <div class="flex justify-between items-center mb-8">
          <div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Buku Rekening Payout</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Ajukan pencairan dana komisi Anda ke Bank atau E-Wallet.</p>
          </div>
        </div>
        <WithdrawForm initialBalance={(user?.balance as number) || 0} />
      </div>
    </MemberLayout>
  )
})
