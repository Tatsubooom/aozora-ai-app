# ---- ビルド ----
FROM golang:1.25-alpine AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
# CGO無効で静的バイナリにする（distrolessで動かすため）
RUN CGO_ENABLED=0 GOOS=linux go build -o /server .

# ---- 実行 ----
FROM gcr.io/distroless/static-debian12
COPY --from=build /server /server
ENV PORT=8080
CMD ["/server"]