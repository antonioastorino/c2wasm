#define TRUE (1)
#define FALSE (0)
#define KEY_BASE (65)
#define KEY_MAX (90)
#define KEY_W (87)
#define KEY_A (65)
#define KEY_S (83)
#define KEY_D (68)
#define KEY_P (80)
#define KEY_G (71)
#define _UP_MASK (1 << (KEY_W - KEY_BASE))
#define _LEFT_MASK (1 << (KEY_A - KEY_BASE))
#define _DOWN_MASK (1 << (KEY_S - KEY_BASE))
#define _RIGHT_MASK (1 << (KEY_D - KEY_BASE))
#define _PAUSE_MASK (1 << (KEY_P - KEY_BASE))
#define _START_MASK (1 << (KEY_G - KEY_BASE))
#define WINDOW_WIDTH_PX (1000)
#define WINDOW_HEIGHT_PX (600)
#define WALL_WIDTH_PX (1400)
#define WALL_HEIGHT_PX (1000)
#define WALL_BORDER_PX (1000)
#define FOV_MAX_Z (10)
#define FOV_MIN_Z (1)
#define NUM_OF_WALLS (20)
#define PLAYER_SPEED_Z (5)
#define PLAYER_ACCELERATION_XY (2000.0)
#define FRICTION (-2.0)
#define PLAYER_SIZE_PX (100)
#define MAX_PLAYER_POS_X (10000) //((WALL_WIDTH_PX - PLAYER_SIZE_PX) / 2)
#define MAX_PLAYER_POS_Y (10000) //((WALL_HEIGHT_PX - PLAYER_SIZE_PX) / 2)

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
    float border_width;
} Wall;

typedef struct
{
    Vector3D position;
    Vector3D speed;
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

typedef struct
{
    int ticks;
    int inc_x;
    int inc_y;
} PathElement;

typedef struct
{
    bool player_left;
    bool player_right;
    bool player_up;
    bool player_down;
    bool player_pause;
    bool player_start;
} PlayerAction;

typedef enum
{
    GAME_BEGIN,
    GAME_PAUSED,
    GAME_RUNNING,
} GameState;

float g_dt                   = 0;
int g_keys_pressed           = 0;
Wall g_walls[NUM_OF_WALLS]   = {0};
Entity g_player              = (Entity){.position = {0}, .speed = {0}, .alive = TRUE, .animated = TRUE};
PlayerAction g_player_action = {0};
float g_path_x               = 0.0;
float g_path_y               = 0.0;
int g_tick                   = 0;
bool g_prev_pause_pressed    = false;
GameState g_game_state       = GAME_BEGIN;

const PathElement g_path[] = {
    {10, 0, 0},
    {20, 10, 0},
    {20, 0, 10},
    {20, -10, -10},
    {10, 0, 0},
    {10, -30, -30},
    {10, -40, 0},
    {10, 0, 30},
    {10, 70, 0},
};

void jsLogVector3D(Vector3D);
void jsLogCStr(char*);
void jsLogInt(int);
void jsLogFloat(float);
float jsGetDt(void);
void jsSetEngineParams(EngineParams);
void jsUpdateWallRect(int, Rect, int, float);

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
                          .y = 0,
                          .z = position_z,
                },
                      .size = (Size2D){
                          .w = WALL_WIDTH_PX,
                          .h = WALL_HEIGHT_PX,
                },
            },
                  .brightness   = 0,
                  .border_width = WALL_BORDER_PX,
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
}

void engine_key_up(int key_code)
{
    if (key_code < KEY_BASE || key_code > KEY_MAX)
    {
        return;
    }
    g_keys_pressed &= ~(1 << (key_code - KEY_BASE));
}

void __read_input(void)
{
    g_player_action.player_up    = (g_keys_pressed & _UP_MASK) && (g_player.position.y <= MAX_PLAYER_POS_Y);
    g_player_action.player_down  = (g_keys_pressed & _DOWN_MASK) && (g_player.position.y >= -MAX_PLAYER_POS_Y);
    g_player_action.player_right = (g_keys_pressed & _RIGHT_MASK) && (g_player.position.x <= MAX_PLAYER_POS_X);
    g_player_action.player_left  = (g_keys_pressed & _LEFT_MASK) && (g_player.position.x >= -MAX_PLAYER_POS_X);
    bool curr_pause_pressed      = (g_keys_pressed & _PAUSE_MASK) && (g_game_state != GAME_BEGIN);
    if (!g_prev_pause_pressed && curr_pause_pressed)
    {
        g_player_action.player_pause = !g_player_action.player_pause;
    }
    g_prev_pause_pressed = curr_pause_pressed;
    if (g_keys_pressed & _START_MASK)
    {
        g_player_action.player_start = true;
    }
}

void __evolve_wall(int wall_index, int path_element_index)
{
    g_dt = 0;
    switch (g_game_state)
    {
    case GAME_BEGIN:
        if (g_player_action.player_start)
        {
            g_game_state = GAME_RUNNING;
        }
        break;
    case GAME_RUNNING:
    {
        if (g_player_action.player_pause)
        {
            g_game_state = GAME_PAUSED;
            break;
        }
        g_dt         = jsGetDt();
        Wall* wall_p = &g_walls[wall_index];
        wall_p->world.position.z -= PLAYER_SPEED_Z * g_dt;
        if (wall_p->world.position.z <= FOV_MIN_Z)
        {
            g_path_x += g_path[path_element_index].inc_x;
            g_path_y += g_path[path_element_index].inc_y;
            g_tick++;
            wall_p->world.position.z += (float)(FOV_MAX_Z - FOV_MIN_Z);
            wall_p->world.position.x = g_path_x;
            wall_p->world.position.y = g_path_y;
        }
        wall_p->proj.position.x =                                                                        //
            (wall_p->world.position.x - wall_p->world.size.w / 2 - WALL_BORDER_PX - g_player.position.x) //
                / wall_p->world.position.z
            + WINDOW_WIDTH_PX / 2;
        wall_p->proj.position.y =                                                                        //
            (wall_p->world.position.y - wall_p->world.size.h / 2 - WALL_BORDER_PX - g_player.position.y) //
                / wall_p->world.position.z
            + WINDOW_HEIGHT_PX / 2;
        wall_p->proj.position.z = wall_p->world.position.z;
        wall_p->proj.size.w     = wall_p->world.size.w / wall_p->world.position.z;
        wall_p->proj.size.h     = wall_p->world.size.h / wall_p->world.position.z;
        wall_p->brightness      = 255 * (1 - (wall_p->world.position.z - FOV_MIN_Z) / (FOV_MAX_Z - FOV_MIN_Z));
        wall_p->border_width    = WALL_BORDER_PX / wall_p->world.position.z;
    }
    break;
    case GAME_PAUSED:
        if (!g_player_action.player_pause)
        {
            g_game_state = GAME_RUNNING;
        }
        break;
    } // switch(g_game_state)
}

void __evolve(void)
{
    static int path_element_index = 0;
    static int tick_threshold     = 10;
    if (g_tick == tick_threshold)
    {
        g_tick             = 0;
        path_element_index = (path_element_index + 1) % (sizeof(g_path) / sizeof(g_path[0]));
        tick_threshold     = g_path[path_element_index].ticks;
    }
    for (int wall_index = 0; wall_index < NUM_OF_WALLS; wall_index++)
    {
        __evolve_wall(wall_index, path_element_index);
    }
}

void __update_output(void)
{
    if (g_game_state == GAME_RUNNING)
    {
        g_player.speed.x += g_dt *                                                                                   //
                            (FRICTION * g_player.speed.x                                                             //
                             + PLAYER_ACCELERATION_XY * (g_player_action.player_right - g_player_action.player_left) //
                            );
        g_player.speed.y += g_dt *                                                                                //
                            (FRICTION * g_player.speed.y                                                          //
                             + PLAYER_ACCELERATION_XY * (g_player_action.player_up - g_player_action.player_down) //
                            );
        g_player.position.x += g_player.speed.x * g_dt;
        g_player.position.y += g_player.speed.y * g_dt;
        for (int wall_index = 0; wall_index < NUM_OF_WALLS; wall_index++)
        {
            jsUpdateWallRect(wall_index, //
                             g_walls[wall_index].proj,
                             g_walls[wall_index].brightness,
                             g_walls[wall_index].border_width);
        }
    }
}

void engine_update(void)
{
    __read_input();
    __evolve();
    __update_output();
}
