# Homelab image of the analytics panel (http://stats.home, docs/specs/stats-web).
# Only tools/stats is copied in; the service account key is mounted at run
# time (compose.yml) and never enters the image. Build and runtime share the
# same Debian, so the binary finds the glibc it was linked against.

FROM rust:1.96-slim-bookworm AS build
RUN apt-get update \
 && apt-get install -y --no-install-recommends cmake clang \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY tools/stats/ ./
RUN cargo build --release --locked --bin stats && strip target/release/stats

FROM debian:bookworm-slim
ARG UID=1000
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid "$UID" --no-create-home stats \
 && mkdir /cache && chown stats /cache
COPY --from=build /src/target/release/stats /usr/local/bin/stats
USER stats
ENV XDG_CACHE_HOME=/cache GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/stats-sa.json
EXPOSE 8080
CMD ["stats", "web", "--bind", "0.0.0.0", "--port", "8080", "--host-name", "stats.home", "--no-open"]
