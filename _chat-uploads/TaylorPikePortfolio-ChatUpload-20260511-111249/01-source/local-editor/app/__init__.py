from flask import Flask


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )

    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

    from .routes import bp

    app.register_blueprint(bp)

    return app