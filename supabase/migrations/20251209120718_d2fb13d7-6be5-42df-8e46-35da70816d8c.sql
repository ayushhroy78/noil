-- Enable RLS on archive tables (admin-only access)

ALTER TABLE public.daily_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_scans_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions_archive ENABLE ROW LEVEL SECURITY;

-- Archive tables are admin-only for data retention management
CREATE POLICY "Admins can view daily_logs_archive"
ON public.daily_logs_archive FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert daily_logs_archive"
ON public.daily_logs_archive FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete daily_logs_archive"
ON public.daily_logs_archive FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view barcode_scans_archive"
ON public.barcode_scans_archive FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert barcode_scans_archive"
ON public.barcode_scans_archive FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete barcode_scans_archive"
ON public.barcode_scans_archive FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view chat_messages_archive"
ON public.chat_messages_archive FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chat_messages_archive"
ON public.chat_messages_archive FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chat_messages_archive"
ON public.chat_messages_archive FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view point_transactions_archive"
ON public.point_transactions_archive FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert point_transactions_archive"
ON public.point_transactions_archive FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete point_transactions_archive"
ON public.point_transactions_archive FOR DELETE
USING (has_role(auth.uid(), 'admin'));