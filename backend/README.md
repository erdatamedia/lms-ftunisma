# LMS UNISMA Backend

Backend LMS untuk:
- auth
- courses
- classes
- enrollments
- meetings
- attendance QR
- materials
- assignments
- submissions
- reports

## Development
pnpm install
pnpm prisma:generate
pnpm start:dev

## Swagger
http://localhost:3001/docs

## Seed
npx prisma db seed

## Production
pnpm install
pnpm prisma:generate
pnpm prisma:deploy
pnpm build
pnpm start:prod
