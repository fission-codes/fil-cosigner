up-calibration: down-calibration
	DOCKER_BUILDKIT=1 \
	LOTUS_IMAGE_TAG=ntwk-calibration-d6c42 \
	docker-compose \
		-p calibration \
		-f docker-compose.yaml \
		up --build 
.PHONY: up-calibration

down-calibration:
	DOCKER_BUILDKIT=1 \
	LOTUS_IMAGE_TAG=v1.5.2 \
	docker-compose \
		-p calibration \
		-f docker-compose.yaml \
		down
.PHONY: down

# up-calibration: down-calibration
# 	DOCKER_BUILDKIT=1 \
# 	LOTUS_IMAGE_TAG=ntwk-calibration-d6c42 \
# 	docker-compose \
# 		-p calibration \
# 		-f docker-compose.yaml \
# 		-f ipfs-image.yaml \
# 		-f powergate-build-context.yaml \
# 		up --build 
# .PHONY: up-calibration

# down-calibration:
# 	DOCKER_BUILDKIT=1 \
# 	LOTUS_IMAGE_TAG=v1.5.2 \
# 	docker-compose \
# 		-p mainnet \
# 		-f docker-compose.yaml \
# 		-f ipfs-image.yaml \
# 		-f powergate-build-context.yaml \
# 		down
# .PHONY: down

