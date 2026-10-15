# CampusMart backend
python -m venv env && env\Scripts\activate   (Mac/Linux: source env/bin/activate)
pip install -r requirements.txt
python manage.py makemigrations users listings cart orders
python manage.py migrate
python manage.py seed_listings --with-orders
python manage.py runserver 8000
