-- Supabase membuka skema public lewat Data API (PostgREST) untuk siapa pun yang memegang anon key.
-- RLS tanpa policy menutup akses itu. Aplikasi terhubung sebagai pemilik tabel, yang tidak terkena RLS,
-- jadi akses lewat Prisma tidak berubah. Di PostgreSQL biasa (tanpa Supabase) perintah ini tidak berdampak.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "narasumber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dokumen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kegiatan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "undangan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "token_akun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
