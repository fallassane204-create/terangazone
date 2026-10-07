-- PRÉPARÉ UNIQUEMENT : exécution manuelle après accord, jamais automatique.
-- Bucket public réservé aux illustrations du catalogue, aucun document client.
-- L’admin accepte JPG/JPEG, PNG et WebP en entrée. Le serveur les décode et
-- les convertit systématiquement en WebP avant upload (Content-Type image/webp).
-- Les policies .webp portent sur le fichier stocké, pas sur la photo d’origine.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('service-images','service-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
-- Ne change pas les paramètres d'un bucket préexistant incompatible.
do $$ begin
  if not exists(select 1 from storage.buckets where id='service-images' and public
    and file_size_limit=5242880 and allowed_mime_types @> array['image/webp']::text[]
    and allowed_mime_types <@ array['image/jpeg','image/png','image/webp']::text[]) then
    raise exception 'Bucket service-images existant incompatible : vérifier avant activation.';
  end if;
end $$;
drop policy if exists tz_images_admin_select on storage.objects;
create policy tz_images_admin_select on storage.objects for select to authenticated
using(bucket_id='service-images' and (select public.tz_is_catalogue_admin()));
drop policy if exists tz_images_admin_insert on storage.objects;
create policy tz_images_admin_insert on storage.objects for insert to authenticated
with check(bucket_id='service-images' and name ~ '^services/[0-9a-f-]{36}\.webp$'
  and (select public.tz_is_catalogue_admin()));
drop policy if exists tz_images_admin_delete on storage.objects;
create policy tz_images_admin_delete on storage.objects for delete to authenticated
using(bucket_id='service-images' and (select public.tz_is_catalogue_admin()));
-- Limites restrictives, même si une ancienne policy permissive existe.
-- Les autres buckets ne changent pas de comportement.
drop policy if exists tz_images_insert_boundary on storage.objects;
create policy tz_images_insert_boundary on storage.objects as restrictive for insert to anon,authenticated
with check(bucket_id<>'service-images' or ((select public.tz_is_catalogue_admin())
  and name ~ '^services/[0-9a-f-]{36}\.webp$'));
drop policy if exists tz_images_update_boundary on storage.objects;
create policy tz_images_update_boundary on storage.objects as restrictive for update to anon,authenticated
using(bucket_id<>'service-images') with check(bucket_id<>'service-images');
drop policy if exists tz_images_delete_boundary on storage.objects;
create policy tz_images_delete_boundary on storage.objects as restrictive for delete to anon,authenticated
using(bucket_id<>'service-images' or (select public.tz_is_catalogue_admin()));
drop policy if exists tz_images_select_boundary on storage.objects;
create policy tz_images_select_boundary on storage.objects as restrictive for select to anon,authenticated
using(bucket_id<>'service-images' or (select public.tz_is_catalogue_admin()));
commit;
