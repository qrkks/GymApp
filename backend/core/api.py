from ninja import NinjaAPI
from gym.api import router as gym_router
from ninja.security import django_auth


api = NinjaAPI(auth=django_auth)

api.add_router('/', gym_router)


@api.get('/')
def get_test(request):
    return 'ok'


@api.post('/')
def post_test(request):
    return 'ok'
