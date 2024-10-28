from django.test import TestCase
from station.models import Station, Access_Station

class StationModelTestCase(TestCase):
    def test_create_station(self):
        station = Station.objects.create(
            station_name="PNBE",
            station_id=1,
            station_code=123,
            chi_id=456,
            station_zone="Zone A",
            name_of_work="Work ABC",
            contract_by="Contractor XYZ",
            contract_no="12345"
        )
        self.assertIsInstance(station, Station)
        self.assertEqual(station.station_name, "PNBE")
        # Add more assertions for other fields

    def test_create_access_station(self):
        access_station = Access_Station.objects.create(
            access_stations="Station 1, Station 2, Station 3",
            user_name="testuser"
        )
        self.assertIsInstance(access_station, Access_Station)
        self.assertEqual(access_station.user_name, "testuser")
        # Add more assertions for other fields

    # def test_station_str_method(self):
    #     station = Station.objects.create(
    #         station_name="Test Station",
    #         station_code=789
    #     )
    #     self.assertEqual(str(station), "Test Station")

    # def test_access_station_str_method(self):
    #     access_station = Access_Station.objects.create(
    #         user_name="testuser"
    #     )
    #     self.assertEqual(str(access_station), "user123")

    def tearDown(self):
        Station.objects.all().delete()
        Access_Station.objects.all().delete()
