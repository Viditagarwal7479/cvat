# Generated by Django 3.2.12 on 2022-03-14 10:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engine', '0051_auto_20220220_1824'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cloudstorage',
            name='specific_attributes',
            field=models.CharField(blank=True, max_length=1024),
        ),
    ]