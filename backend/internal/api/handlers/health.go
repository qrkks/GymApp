package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// Check 健康检查端点
// @Summary 健康检查
// @Description 检查服务是否正常运行
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func (h *HealthHandler) Check(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "ok",
		Message: "GymApp Backend is running",
	})
}
