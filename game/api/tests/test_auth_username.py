"""username из email при регистрации."""

from app.auth_username import allocate_username_from_email, username_base_from_email


def test_username_base_from_email_includes_domain():
    assert username_base_from_email("Player@Yandex.RU") == "player_yandex_ru"
    assert username_base_from_email("player@gmail.com") == "player_gmail_com"


def test_allocate_username_suffix_on_collision(db_session):
    from app.models import User
    from app.auth import get_password_hash

    db_session.add(
        User(
            username="taken_gmail_com",
            email="other@example.com",
            hashed_password=get_password_hash("secret12"),
        )
    )
    db_session.commit()

    assert (
        allocate_username_from_email(db_session, "taken@gmail.com")
        == "taken_gmail_com_2"
    )
