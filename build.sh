export DOCKER_IMAGE_VERSION="dev_$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 8 | head -n 1)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env.docker" ]; then
  set -a
  source "$SCRIPT_DIR/.env.docker"
  set +a
fi

if [ -z "$DOCKER_USER" ] || [ -z "$DOCKER_PASS" ]; then
  echo "Error: define DOCKER_USER y DOCKER_PASS en un archivo .env.docker (junto a build.sh) o como variables de entorno."
  exit 1
fi

echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin docker.io

docker build -t djmarret1992/soap_consulta:${DOCKER_IMAGE_VERSION} -f Dockerfile .
docker tag djmarret1992/soap_consulta:${DOCKER_IMAGE_VERSION} djmarret1992/soap_consulta:latest
docker push djmarret1992/soap_consulta:${DOCKER_IMAGE_VERSION}
docker push djmarret1992/soap_consulta:latest
echo "tag: ${DOCKER_IMAGE_VERSION}"