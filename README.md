# Learn Together

پلتفرم یادگیری تیمی/شخصی — Next.js 14، Prisma، PostgreSQL، NextAuth (Credentials).

## راه‌اندازی

```bash
cd learn-together
cp .env.example .env   # اگر .env ندارید — Prisma بدون DATABASE_URL خطای P1012 می‌دهد

# PostgreSQL محلی (اختیاری):
docker compose up -d

npm install
npx prisma migrate deploy   # توسعه: npx prisma migrate dev
npm run db:seed             # تیم + کتاب FSA (کد دعوت پیش‌فرض FSA26)
npm run db:setup-team       # عضو کردن ۲ کاربر واقعی + موضوع کتاب (اگر از قبل seed نشده)
npm run dev
```

## اولین درس تیمی (کتاب seed)

1. `npm run db:seed` — تیم «تیم یادگیری» و موضوع *Fundamentals of Software Architecture* ساخته می‌شود.
2. ثبت‌نام کنید.
3. در **یادگیری تیمی** با کد `SEED_TEAM_INVITE_CODE` (پیش‌فرض `FSA26`) به تیم seed بپیوندید (اگر تیم جدید ساختید، موضوع seed را نمی‌بینید — باید join کنید).
4. موضوع کتاب را باز کنید و پیشرفت را تیک بزنید.

## Vercel

- Env: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SEED_TEAM_INVITE_CODE`
- Build: `prisma generate && next build` (در `package.json`)
- پس از deploy: `npx prisma migrate deploy` و یک‌بار `npm run db:seed` روی DB production

## MVP

- یک تیم فعال per کاربر (ساخت یا پیوستن).
- موضوعات PERSONAL/TEAM، فصل/زیرفصل تو در تو، progress سه‌حالته، پرامپت‌ساز، تاریخچه ۷ روز.
