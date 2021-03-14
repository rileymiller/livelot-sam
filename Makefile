.PHONY: build-RuntimeDependenciesLayer build-lambda-common
.PHONY: build-AuthFunction build-PreSignupFunction build-PostSignupFunction build-UserCreateFunction build-UserGetAllFunction build-UserGetFunction build-UserUpdateFunction build-UserDeleteFunction

# User Service
build-AuthFunction:
	$(MAKE) HANDLER=src/handlers/user-auth.ts build-lambda-common

build-PreSignupFunction:
	$(MAKE) HANDLER=src/handlers/pre-signup.ts build-lambda-common

build-PostSignupFunction:
	$(MAKE) HANDLER=src/handlers/post-signup.ts build-lambda-common

build-UserCreateFunction:
	$(MAKE) HANDLER=src/handlers/user-create.ts build-lambda-common

build-UserGetAllFunction:
	$(MAKE) HANDLER=src/handlers/user-get-all.ts build-lambda-common

build-UserGetFunction:
	$(MAKE) HANDLER=src/handlers/user-get.ts build-lambda-common

build-UserUpdateFunction:
	$(MAKE) HANDLER=src/handlers/user-update.ts build-lambda-common

build-UserDeleteFunction:
	$(MAKE) HANDLER=src/handlers/user-delete.ts build-lambda-common

# Image upload service
build-NotifyDetectionFunction:
	$(MAKE) HANDLER=src/handlers/notify-detection.ts build-lambda-common

build-GetSignedURLFunction:
	$(MAKE) HANDLER=src/handlers/get-signed-url.ts build-lambda-common

build-ImageUploadedFunction:
	$(MAKE) HANDLER=src/handlers/image-uploaded.ts build-lambda-common

# ARTIFACTS_DIR is emmitted by the SAM cli
build-lambda-common:
	rm -rf node_modules/
	npm install
	rm -rf dist
	echo "{\"extends\": \"./tsconfig.json\", \"include\": [\"${HANDLER}\"] }" > tsconfig-only-handler.json
	npm run build -- --build tsconfig-only-handler.json
	cp -r dist "$(ARTIFACTS_DIR)/"

build-RuntimeDependenciesLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)/nodejs/"
	npm install --production --prefix "$(ARTIFACTS_DIR)/nodejs/"
	rm "$(ARTIFACTS_DIR)/nodejs/package.json" # to avoid rebuilding when changes don't relate to dependencies

