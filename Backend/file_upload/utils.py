import logging
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO


def format_image(file, full_file_name, image_format, quality):
    try:
        logging.info(f"The file we are working on is {file}")
        image = Image.open(file)
        image = image.convert('RGB')
        target_size = 150 * 1024
        current_size = file.size
        compression_ratio = (target_size / current_size) ** 0.5
        new_size = tuple(int(dim * compression_ratio) for dim in image.size)
        image = image.resize(new_size, Image.LANCZOS)
        output = BytesIO()
        image.save(output, format=image_format, optimize=True, quality=quality)
        content_type = f'image/{image_format.lower()}'
        output.seek(0)
        new_file = SimpleUploadedFile(
            full_file_name, 
            output.read(), 
            content_type=content_type
            )
        return new_file
    
    except Exception as e:
        logging.exception(f"An error occurred while formatting the image in format_image: {repr(e)}")
        return False
