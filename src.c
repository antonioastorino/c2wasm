#define TRUE (1)
#define FALSE (0)
#define KEY_BASE (65)
#define KEY_MAX (90)
#define KEY_W (87)
#define KEY_A (65)
#define KEY_S (83)
#define KEY_D (68)
#define KEY_W_MASK (1 << (KEY_W - KEY_BASE))
#define KEY_A_MASK (1 << (KEY_A - KEY_BASE))
#define KEY_S_MASK (1 << (KEY_S - KEY_BASE))
#define KEY_D_MASK (1 << (KEY_D - KEY_BASE))
#define WINDOW_WIDTH_PX (800)
#define WINDOW_HEIGHT_PX (600)
#define WALL_INITIAL_Z (10)
#define WALL_INITIAL_Y (-100)
#define PLAYER_SPEED_Z (2)
#define PLAYER_SPEED_XY (100)

typedef int bool;
typedef struct
{
    float x;
    float y;
    float z;
} Vector3D;

typedef struct
{
    float w;
    float h;
} Size2D;

typedef struct
{
    Vector3D position;
    Size2D size;
} Rect;

typedef struct
{
    Rect world;
    Rect proj;
} Wall;

typedef struct
{
    Vector3D position;
    bool alive;
    bool animated;
} Entity;

float g_dt = 0;

Wall g_wall = {
    .world = (Rect){
        .position = (Vector3D){
            .x = -400,
            .y = WALL_INITIAL_Y,
            .z = WALL_INITIAL_Z,
        },
        .size = (Size2D){
            .w = 200,
            .h = 300,
        },
    },
};

void jsLogVector3D(Vector3D);
void jsLogCStr(char*);
void jsLogInt(int);
void jsLogFloat(float);
float jsGetDt(void);
void jsUpdateWallRect(Rect);

int g_keys_pressed = 0;

Entity g_player = (Entity){
    (Vector3D){.x = 100, .y = 100, .z = 0},
    .alive    = TRUE,
    .animated = TRUE};

void engine_init(void)
{
    jsLogCStr("Init game\0");
}

void engine_key_down(int key_code)
{
    if (key_code < KEY_BASE || key_code > KEY_MAX)
    {
        return;
    }
    g_keys_pressed |= 1 << (key_code - KEY_BASE);
    jsLogCStr("pressed\0");
    jsLogInt(g_keys_pressed);
}

void engine_key_up(int key_code)
{
    if (key_code < KEY_BASE || key_code > KEY_MAX)
    {
        return;
    }
    g_keys_pressed &= ~(1 << (key_code - KEY_BASE));
    jsLogCStr("released\0");
    jsLogInt(g_keys_pressed);
}

void __update_player()
{
    if (g_keys_pressed & KEY_W_MASK)
    {
        g_player.position.y += PLAYER_SPEED_XY * g_dt;
    }
    if (g_keys_pressed & KEY_S_MASK)
    {
        g_player.position.y -= PLAYER_SPEED_XY * g_dt;
    }
    if (g_keys_pressed & KEY_D_MASK)
    {
        g_player.position.x += PLAYER_SPEED_XY * g_dt;
    }
    if (g_keys_pressed & KEY_A_MASK)
    {
        g_player.position.x -= PLAYER_SPEED_XY * g_dt;
    }
    jsLogVector3D(g_player.position);
}

void __update_wall()
{
    g_wall.world.position.z -= PLAYER_SPEED_Z * g_dt;
    if (g_wall.world.position.z < 1)
    {
        g_wall.world.position.z = WALL_INITIAL_Z;
    }
    g_wall.proj.position.x = (g_wall.world.position.x - g_wall.world.size.w / 2 - g_player.position.x) / g_wall.world.position.z + WINDOW_WIDTH_PX / 2;
    g_wall.proj.position.y = (g_wall.world.position.y - g_wall.world.size.h / 2 - g_player.position.y) / g_wall.world.position.z + WINDOW_HEIGHT_PX / 2;
    g_wall.proj.size.w     = g_wall.world.size.w / g_wall.world.position.z;
    g_wall.proj.size.h     = g_wall.world.size.h / g_wall.world.position.z;
    jsUpdateWallRect(g_wall.proj);
}

int engine_get_window_height(void)
{
    return WINDOW_HEIGHT_PX;
}

int engine_get_window_width(void)
{
    return WINDOW_WIDTH_PX;
}

void engine_update()
{
    g_dt = jsGetDt();
    __update_player();
    __update_wall();
    //    update_enemy();
    jsLogVector3D(g_player.position);
}
