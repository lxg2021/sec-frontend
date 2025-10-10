# 1️⃣ 创建本地临时目录
mkdir F:\guacmole\schema

# 2️⃣ 拷贝 schema 目录到本地
docker cp guacamole:/opt/guacamole/extensions/guacamole-auth-jdbc/mysql/schema F:/guacmole/schema

# 3️⃣ 导入基础表
docker exec -i guac-mysql mysql -u root -pRootPassword123 guacamole_db < F:/guacmole/schema/001-create-schema.sql

# 4️⃣ 导入默认 admin 用户
docker exec -i guac-mysql mysql -u root -pRootPassword123 guacamole_db < F:/guacmole/schema/002-create-admin-user.sql

# 5️⃣ 验证
docker exec -it guac-mysql mysql -u root -pRootPassword123 guacamole_db -e "SHOW TABLES;"

# 6️⃣ 重启 Guacamole Web
docker-compose restart guacamole
