# from storages.backends.s3boto3 import S3Boto3Storage


# # class StaticStorage(S3Boto3Storage):
# #     location = 'static'
# #     default_acl = 'public-read'


# class PublicMediaStorage(S3Boto3Storage):
#     location = 'media'
#     default_acl = 'public-read'
#     file_overwrite = False


from storages.backends.s3boto3 import S3Boto3Storage

class MediaStorage(S3Boto3Storage):
    bucket_name = 'cmsdnrmediabucketimage'