# import unittest
# from rest_framework.test import APIRequestFactory
# from rest_framework.response import Response
# from rest_framework import status
# from user_onboarding.models import User  # Adjust the import based on the custom User model
# from website.decorators import allowed_users

# class TestDecorators(unittest.TestCase):

#     def test_allowed_users_decorator(self):
#         # Creating a dummy user
#         user_type_id = 1  # Assuming the user_type ID is 1
#         user = User.objects.create_user(
#             username='testuser',
#             password='testpassword',
#             user_type=user_type_id,
#             first_name='Dummy',
#             email='dummy@example.com',
#             phone='1234567890'
#         )
#         factory = APIRequestFactory()
#         request = factory.get('/dummy-url/')
#         request.user = user

#         # Applying the decorator to a dummy function
#         @allowed_users([1, 2])  # Assuming the allowed user_type IDs are 1 and 2
#         def dummy_function(request):
#             return Response({'data': 'Success!'}, status=status.HTTP_200_OK)

#         response = dummy_function(request)
#         self.assertEqual(response.status_code, 200)  # Ensure the response status code is as expected

# if __name__ == '__main__':
#     unittest.main()