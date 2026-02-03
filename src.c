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
#define WINDOW_WIDTH_PX (1000)
#define WINDOW_HEIGHT_PX (600)
#define WALL_WIDTH_PX (50)
#define WALL_HEIGHT_PX (400)
#define FOV_MAX_Z (10)
#define FOV_MIN_Z (1)
#define NUM_OF_WALLS (20)
#define WALL_INITIAL_Y (-100)
#define PLAYER_SPEED_Z (1.0)
#define PLAYER_SPEED_XY (200)

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
    int brightness;
} Wall;

typedef struct
{
    Vector3D position;
    bool alive;
    bool animated;
} Entity;

typedef struct
{
    int window_height_px;
    int window_width_px;
    int fov_max_z;
    int fov_min_z;
    int num_of_walls;
} EngineParams;

float g_dt = 0;

Wall g_walls[NUM_OF_WALLS];

void jsLogVector3D(Vector3D);
void jsLogCStr(char*);
void jsLogInt(int);
void jsLogFloat(float);
float jsGetDt(void);
void jsSetEngineParams(EngineParams);
void jsUpdateWallRect(int, Rect, int);

int g_keys_pressed = 0;

Entity g_player = (Entity){
    (Vector3D){.x = 0, .y = 0, .z = 0},
    .alive    = TRUE,
    .animated = TRUE};

void engine_init(void)
{
    jsLogCStr("Init game\0");
    for (int i = 0; i < NUM_OF_WALLS; i++)
    {
        float position_z = (float)i * (float)(FOV_MAX_Z - FOV_MIN_Z) / (float)NUM_OF_WALLS + (float)FOV_MIN_Z;
        g_walls[i]       = (Wall){
                  .world = (Rect){
                      .position = (Vector3D){
                          .x = 0,
                          .y = WALL_INITIAL_Y,
                          .z = position_z,
                },
                      .size = (Size2D){
                          .w = WALL_WIDTH_PX,
                          .h = WALL_HEIGHT_PX,
                },
            },
                  .brightness = 0,
        };
    }
    jsSetEngineParams((EngineParams){
        .window_height_px = WINDOW_HEIGHT_PX,
        .window_width_px  = WINDOW_WIDTH_PX,
        .fov_max_z        = FOV_MAX_Z,
        .fov_min_z        = FOV_MIN_Z,
        .num_of_walls     = NUM_OF_WALLS,
    });
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

void __update_player(void)
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
}

void __evolve_wall(int wall_index)
{
    Wall* wall_p = &g_walls[wall_index];
    wall_p->world.position.z -= PLAYER_SPEED_Z * g_dt;
    if (wall_p->world.position.z < FOV_MIN_Z)
    {
        wall_p->world.position.z += (float)(FOV_MAX_Z - FOV_MIN_Z);
    }
    wall_p->proj.position.x = (wall_p->world.position.x - wall_p->world.size.w / 2 - g_player.position.x) / wall_p->world.position.z + WINDOW_WIDTH_PX / 2;
    wall_p->proj.position.y = (wall_p->world.position.y - wall_p->world.size.h / 2 - g_player.position.y) / wall_p->world.position.z + WINDOW_HEIGHT_PX / 2;
    wall_p->proj.position.z = wall_p->world.position.z;
    wall_p->proj.size.w     = wall_p->world.size.w / wall_p->world.position.z;
    wall_p->proj.size.h     = wall_p->world.size.h / wall_p->world.position.z;
    wall_p->brightness      = 255 * (1 - (wall_p->world.position.z - FOV_MIN_Z) / (FOV_MAX_Z - FOV_MIN_Z));
}

void engine_update(void)
{
    g_dt = jsGetDt();
    __update_player();
    for (int i = 0; i < NUM_OF_WALLS; i++)
    {
        __evolve_wall(i);
        jsUpdateWallRect(i, g_walls[i].proj, g_walls[i].brightness);
    }
}
