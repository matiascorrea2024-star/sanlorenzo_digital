-- Los 3 buckets públicos de Storage no tenían file_size_limit ni
-- allowed_mime_types configurados -- la validación de tipo/tamaño de
-- lib/media.ts y de los <input type="file" accept="..."> corría solo
-- del lado del cliente. Cualquier usuario autenticado podía llamar
-- directo a la API de Storage y subir un archivo de cualquier tipo o
-- tamaño saltándose esa validación por completo.

update storage.buckets
set file_size_limit = 41943040, -- 40MB, ya era el límite real de business-media
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp', 'video/x-matroska'
    ]
where id = 'business-media';

update storage.buckets
set file_size_limit = 10485760, -- 10MB, de sobra para una imagen de historia sin comprimir
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'stories';

-- Bucket sin uso en el código actual (superado por business-media),
-- se deja igual de restringido por las dudas ya que sigue siendo público.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'negocios';
