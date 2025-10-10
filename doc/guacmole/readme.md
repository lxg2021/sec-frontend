## 访问

1. 打开浏览器访问 `http://localhost:8080/guacamole`
2. 默认登录账号：`guacadmin` / `guacadmin`

## 安装

1. 拉去镜像 `docker-compose up -d`

2. gitbash中执行

   ```
   # 2️⃣ 拷贝 schema 目录到本地
   docker cp guacamole:/opt/guacamole/extensions/guacamole-auth-jdbc/mysql/schema F:/guacmole/schema
   
   # 3️⃣ 导入基础表
   docker exec -i guac-mysql mysql -u root -pRootPassword123 guacamole_db < F:/guacmole/schema/001-create-schema.sql
   
   # 4️⃣ 导入默认 admin 用户
   docker exec -i guac-mysql mysql -u root -pRootPassword123 guacamole_db < F:/guacmole/schema/002-create-admin-user.sql
   
   # 5️⃣ 验证
   docker exec -it guac-mysql mysql -u root -pRootPassword123 guacamole_db -e "SHOW TABLES;"
   ```

3.  停止 `docker-compose down`
4.  再次拉起来 `docker-compose up -d`

https://guacamole.apache.org/