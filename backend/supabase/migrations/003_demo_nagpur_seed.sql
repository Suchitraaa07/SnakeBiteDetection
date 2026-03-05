-- Demo seed data for a richer Nagpur heatmap view
-- Run manually in Supabase SQL editor for demos.

begin;

insert into incidents (type, lat, lng, severity)
select *
from (
    values
        ('snakebite', 21.1460, 79.0890, 'high'),
        ('snakebite', 21.1470, 79.0880, 'high'),
        ('snakebite', 21.1480, 79.0900, 'medium'),
        ('snakebite', 21.1490, 79.0870, 'medium'),
        ('snakebite', 21.1500, 79.0910, 'high'),
        ('snakebite', 21.1440, 79.0860, 'low'),
        ('snakebite', 21.1430, 79.0890, 'medium'),
        ('snakebite', 21.1515, 79.0930, 'high'),
        ('snakebite', 21.1520, 79.0940, 'high'),
        ('snakebite', 21.1530, 79.0920, 'medium'),
        ('snakebite', 21.1540, 79.0950, 'high'),
        ('snakebite', 21.1550, 79.0960, 'medium'),
        ('snakebite', 21.1400, 79.0830, 'low'),
        ('snakebite', 21.1410, 79.0840, 'medium'),
        ('snakebite', 21.1420, 79.0850, 'medium'),
        ('snakebite', 21.1390, 79.0820, 'low'),
        ('snakebite', 21.1380, 79.0810, 'medium'),
        ('snakebite', 21.1455, 79.0990, 'high'),
        ('snakebite', 21.1462, 79.1000, 'high'),
        ('snakebite', 21.1471, 79.1015, 'medium'),
        ('snakebite', 21.1483, 79.1025, 'high'),
        ('snakebite', 21.1492, 79.1030, 'medium'),
        ('snakebite', 21.1503, 79.1040, 'high'),
        ('snakebite', 21.1512, 79.1050, 'high'),
        ('snakebite', 21.1350, 79.0890, 'low'),
        ('snakebite', 21.1340, 79.0905, 'medium'),
        ('snakebite', 21.1330, 79.0910, 'medium'),
        ('snakebite', 21.1320, 79.0925, 'high'),
        ('snakebite', 21.1315, 79.0930, 'medium'),
        ('snakebite', 21.1305, 79.0940, 'low')
) as v(type, lat, lng, severity)
where (select count(*) from incidents) < 20;

insert into sightings (animal, lat, lng)
select *
from (
    values
        ('snake', 21.1465, 79.0888),
        ('snake', 21.1478, 79.0898),
        ('snake', 21.1491, 79.0909),
        ('snake', 21.1510, 79.0945),
        ('snake', 21.1425, 79.0848),
        ('snake', 21.1398, 79.0828),
        ('snake', 21.1488, 79.1018),
        ('snake', 21.1501, 79.1035),
        ('snake', 21.1328, 79.0921),
        ('snake', 21.1310, 79.0938),
        ('snake', 21.1528, 79.0965),
        ('snake', 21.1452, 79.0975)
) as v(animal, lat, lng)
where (select count(*) from sightings) < 10;

commit;
